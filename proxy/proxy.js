const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require('cors'); // <-- CORS importeren
const app = express();
const PORT = process.env.PORT || 3001;
const ICU_TOKEN = '4cwe2qidrojm55xyvdq6tugtx'; // <-- Vul hier je eigen token in
const ATHLETE_ID = 'i220177'; // <-- Vul hier je atleet-ID in (met i)

app.use(cors()); // <-- CORS toestaan voor alle routes

function getBasicAuthHeader() {
  return 'Basic ' + Buffer.from(`API_KEY:${ICU_TOKEN}`).toString('base64');
}

app.get('/workouts', async (req, res) => {
  const { start, end } = req.query;
  const url = `https://intervals.icu/api/v1/athlete/${ATHLETE_ID}/workouts?start=${start}&end=${end}`;
  const authHeader = getBasicAuthHeader();
  const workoutsRes = await fetch(url, { headers: { Authorization: authHeader } });
  if (!workoutsRes.ok) {
    res.status(workoutsRes.status).send(await workoutsRes.text());
    return;
  }
  const workouts = await workoutsRes.json();
  res.json(workouts);
});

app.get('/zwo/:eventId', async (req, res) => {
  // Gebruik het juiste endpoint voor geplande workouts
  const url = `https://intervals.icu/api/v1/athlete/${ATHLETE_ID}/events/${req.params.eventId}/download.zwo`;
  const authHeader = getBasicAuthHeader();
  console.log(`[proxy] ZWO ophalen (event): ${url}`); // logging
  const zwoRes = await fetch(url, { headers: { Authorization: authHeader } });
  if (!zwoRes.ok) {
    const errorText = await zwoRes.text();
    console.error(`[proxy] Fout bij ophalen ZWO: ${zwoRes.status} - ${errorText}`); // logging
    res.status(zwoRes.status).send(errorText);
    return;
  }
  const zwo = await zwoRes.text();
  res.type('application/xml').send(zwo);
});

app.get('/events', async (req, res) => {
  const { start, end } = req.query;
  const url = `https://intervals.icu/api/v1/athlete/${ATHLETE_ID}/events?start=${start}&end=${end}`;
  const authHeader = getBasicAuthHeader();
  try {
    const eventsRes = await fetch(url, { headers: { Authorization: authHeader } });
    if (!eventsRes.ok) {
      res.status(eventsRes.status).send(await eventsRes.text());
      return;
    }
    const events = await eventsRes.json();
    res.json(events);
  } catch (e) {
    res.status(500).send('Fout bij ophalen events: ' + e.message);
  }
});

app.listen(PORT, () => console.log('Proxy draait op http://localhost:' + PORT));