const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const playersGetQuery = `
    SELECT * FROM player_details;`;
  const players = await db.all(playersGetQuery);
  response.send(
    players.map((eachItem) => ({
      playerId: eachItem.player_id,
      playerName: eachItem.player_name,
    }))
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
      *
    FROM 
      player_details 
    WHERE 
      player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerQuery = `
            UPDATE
              player_details
            SET
              player_name = '${playerName}'
              
            WHERE
              player_id = ${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getMatchQuery = `
    SELECT
      *
    FROM
      match_details
      WHERE match_id= ${matchId};`;

  const match = await db.get(getMatchQuery);
  response.send(convertMatchDbObjectToResponseObject(match));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatDataQuery = `
    SELECT
      player_id AS playerId,
        player_name AS playerName,
      SUM(score) AS totalScore, 
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
      
    FROM
      player_details INNER JOIN player_match_score
      ON player_details.player_id = player_match_score.player_id
    WHERE
      player_id=${playerId};`;
  const statsArray = await db.get(getStatDataQuery);
  response.send(statsArray);
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMathDetailsQuery = `
    SELECT match_id, match, year

    FROM match_details NATURAL JOIN player_match_score
      
    WHERE
      player_id = ${playerId};`;

  const playerMatches = await db.get(getPlayerMathDetailsQuery);
  response.send(playerMatches);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const getMatchPlayerQuery = `
    SELECT
      *
    FROM
      player_details INNER JOIN player_match_score ON 
      player_details.player_id = player_match_score.player_id

      WHERE match_id= ${matchId};`;

  const playerArray = await db.get(getMatchPlayerQuery);
  response.send(playerArray);
});

module.exports = app;
