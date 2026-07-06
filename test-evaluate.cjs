const axios = require('axios');
axios.post('http://localhost:3000/api/pronunciation/evaluate', {
  task_id: 1,
  transcribed_text: "hello",
  sentence_index: 0
}).then(console.log).catch(err => console.error(err.response ? err.response.data : err.message));
