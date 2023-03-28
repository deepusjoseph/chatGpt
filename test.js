const axios = require('axios');

const API_KEY = "YOUR_API_KEY";

async function ask_question(question) {
  try {
    const response = await axios.post('https://api.openai.com/v1/engines/text-davinci-002/completions', {
      prompt: `Answer the following question: ${question}`,
      temperature: 0.5,
      max_tokens: 2048,
      n: 1,
      stop: null,
      timeout: 10
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    const answer = response.data.choices[0].text.trim();
    return answer;
  } catch (error) {
    console.error(error);
    return "Sorry, something went wrong. Please try again later.";
  }
}

const questions = [
  "What is the capital of France?",
  "Who is the current President of the United States?",
  "What is the tallest mountain in the world?",
];

async function ask_questions() {
  for (const question of questions) {
    const answer = await ask_question(question);
    console.log(`Q: ${question}\nA: ${answer}\n`);
  }
}

ask_questions();
