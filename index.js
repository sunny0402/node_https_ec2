//Express.js example taken from: https://github.com/expressjs/express/blob/master/examples/web-service/index.js
require("dotenv").config();

const express = require("express");
const app = express();

// TODO uninstall and remove from package.json
// const bodyParser = require("body-parser");
// app.use(bodyParser());

const port = process.env.PORT || 5000;

const apiKeys = [process.env.KEY_1, process.env.KEY_2, process.env.KEY_3];

const users = [{ name: "tobi" }, { name: "loki" }, { name: "jane" }];

const userRepos = {
  tobi: ["repo 1"],
  loki: ["repo 1", "repo 2"],
  jane: ["repo 3"],
};

const loggerMiddleware = (req, res, next) => {
  console.log("Received request:");
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log("Route parameters:");
  console.log(req.params);
  console.log("Query parameters:");
  console.log(req.query);
  console.log("-------------------------");

  function newResponseWithLog(resObj, resSendFunc) {
    function logResponse(responseContent) {
      resObj.contentToLog = responseContent;
      resObj.send = resSendFunc;
      resObj.send(responseContent);
    }

    // Bind the logResponse function to the resObj context
    const boundLogResponse = logResponse.bind(resObj);

    return boundLogResponse;
  }

  // Override the res.send method
  res.send = newResponseWithLog(res, res.send);
  res.on("finish", () => {
    console.log("response sent", res.contentToLog);
  });
  next();
};

app.use(loggerMiddleware);

const error = (status, msg) => {
  const err = new Error(msg);
  err.status = status;
  return err;
};

app.use("/api", function (req, res, next) {
  const key = req.query["api-key"];

  // key isn't present
  if (!key) return next(error(400, "api key required"));

  // curl "http://localhost:8080/api/users?api-key=xyz123"
  if (apiKeys.indexOf(key) === -1) return next(error(401, "invalid api key"));

  // all good, store req.key for route access
  req.key = key;
  next();
});

// curl "http://localhost:8080/api/users?api-key=abc123"
app.get("/api/users", function (req, res) {
  res.status(200).send(users);
});

// curl "http://localhost:8080/api/user/tobi/repos/?api-key=abc123"
app.get("/api/user/:name/repos", function (req, res, next) {
  const name = req.params.name;
  const user = userRepos[name];

  if (user) res.status(200).send(user);
  else next();
});

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.send({ error: err.message });
});

// curl "http://localhost:8080/api/user/sunny/repos/?api-key=abc123"
app.use(function (req, res) {
  res.status(404);
  res.send({ error: "Sorry, can't find that" });
});

console.log("port: ", port);
console.log("apiKeys: ", apiKeys);

app.listen(port);
console.log("App is listening on port " + port);
