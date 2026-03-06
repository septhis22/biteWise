import Express from "express";
import identifyRouter from "./route/indentify.route.ts";

const app = Express();
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

app.use(Express.json());

app.post("/identify", identifyRouter);

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
