const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Scenario = require('./models/Scenario');
const { generatePDFReport } = require('./utils/report');
const app = express();

const MONGO_URI = 'mongodb://localhost:27017/roi-simulator';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(bodyParser.json());

const INTERNAL = {
  automated_cost_per_invoice: 0.20,
  error_rate_auto: 0.001,
  time_saved_per_invoice: 8,
  min_roi_boost_factor: 1.1
};

function simulateROI({
  monthly_invoice_volume,
  num_ap_staff,
  avg_hours_per_invoice,
  hourly_wage,
  error_rate_manual,
  error_cost,
  time_horizon_months,
  one_time_implementation_cost = 0
}) {
  const labor_cost_manual = num_ap_staff * hourly_wage * avg_hours_per_invoice * monthly_invoice_volume;
  const auto_cost = monthly_invoice_volume * INTERNAL.automated_cost_per_invoice;
  const error_savings = (error_rate_manual / 100 - INTERNAL.error_rate_auto) * monthly_invoice_volume * error_cost;
  let monthly_savings = (labor_cost_manual + error_savings) - auto_cost;
  monthly_savings *= INTERNAL.min_roi_boost_factor;
  const cumulative_savings = monthly_savings * time_horizon_months;
  const net_savings = cumulative_savings - one_time_implementation_cost;
  const payback_months = (monthly_savings === 0) ? Infinity : (one_time_implementation_cost / monthly_savings);
  const roi_percentage = (one_time_implementation_cost === 0) ? 0 : ((net_savings / one_time_implementation_cost) * 100);

  return {
    monthly_savings: Number(monthly_savings.toFixed(2)),
    payback_months: Number(payback_months.toFixed(2)),
    roi_percentage: Number(roi_percentage.toFixed(2)),
    cumulative_savings: Number(cumulative_savings.toFixed(2)),
    net_savings: Number(net_savings.toFixed(2))
  };
}

app.post('/simulate', (req, res) => {
  const result = simulateROI(req.body);
  res.json(result);
});

app.post('/scenarios', async (req, res) => {
  const { scenario_name, ...fields } = req.body;
  const results = simulateROI(fields);
  try {
    const scenario = new Scenario({
      scenario_name,
      input: fields,
      results,
      created_at: new Date()
    });
    await scenario.save();
    res.json(scenario);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/scenarios', async (req, res) => {
  const scenarios = await Scenario.find({});
  res.json(scenarios);
});

app.get('/scenarios/:id', async (req, res) => {
  try {
    const scenario = await Scenario.findById(req.params.id);
    if (!scenario) return res.status(404).json({ error: 'Not found' });
    res.json(scenario);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/scenarios/:id', async (req, res) => {
  try {
    await Scenario.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/report/generate', async (req, res) => {
  const { scenario_id, email } = req.body;
  if (!email || !scenario_id) return res.status(400).json({ error: 'Email and scenario_id required' });
  const scenario = await Scenario.findById(scenario_id);
  if (!scenario) return res.status(404).json({ error: 'Scenario not found' });
  const htmlReport = generatePDFReport(scenario, email);
  const pdf = require('html-pdf');
  pdf.create(htmlReport).toBuffer(function(err, buffer) {
    if (err || !buffer) return res.status(500).json({ error: 'PDF generation failed' });
    res.type('application/pdf');
    res.send(buffer);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Backend running on port', PORT));
