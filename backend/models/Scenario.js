const mongoose = require('mongoose');

const ScenarioSchema = new mongoose.Schema({
  scenario_name: { type: String, required: true },
  input: { type: Object, required: true },
  results: { type: Object, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scenario', ScenarioSchema);
