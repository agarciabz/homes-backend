import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";
import fetch from "node-fetch";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

interface HomeRawData {
  id: string;
  title_es: string;
  description_es: string;
  city: string;
  country: string;
  price_amount: string;
  currency_code: string;
  available_now: boolean;
  m2: number;
}

interface SearchPayload {
  amount: number;
}

interface SearchResponse {
  count: number;
  data: HomeRawData[];
}

interface JsonDatafile {
  key: number;
  value: HomeRawData;
}

const url = "http://feeds.spotahome.com/main.json";
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.post("/search", async (req, res) => {
  const { amount } = req.body as SearchPayload;
  if (!amount) {
    res.status(400).send("Amount is required");
  } else {
    try {
      const fetchRes = await fetch(url);
      const stream = fetchRes.body.pipe(parser()).pipe(streamArray());

      const homes: HomeRawData[] = [];
      let homesCount = 0;

      stream.on("data", (data: JsonDatafile) => {
        homes.push(data.value);
        homesCount++;

        if (homesCount === amount) {
          const searchRes: SearchResponse = {
            count: amount,
            data: homes,
          };
          res.status(200).send(searchRes);
          stream.destroy();
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
