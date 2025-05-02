import express from "express";
import { prisma } from "../prisma/prisma-instance";
import { errorHandleMiddleware } from "./error-handler";
import HttpStatusCode from "./status-codes";
import "express-async-errors";

const {
  OK,
  BAD_REQUEST,
  CREATED,
  INTERNAL_SERVER_ERROR,
  NO_CONTENT,
} = HttpStatusCode;

const app = express();
app.use(express.json());
// All code should go below this line
// get, delete, post, patch

app.get("/", (req, res) => {
  res.status(OK).json({ message: "Hello World!" });
});

app.get("/dogs", async (req, res) => {
  const dogs = await prisma.dog.findMany();
  res.status(OK).send(dogs);
});

app.get("/dogs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res
      .status(BAD_REQUEST)
      .json({ message: "id should be a number" });
  }
  try {
    const dog = await prisma.dog.findUnique({
      where: { id },
    });
    if (!dog) {
      return res.sendStatus(NO_CONTENT);
    }
    return res.status(OK).json(dog);
  } catch (err) {
    console.error(err);
    return res
      .status(INTERNAL_SERVER_ERROR)
      .json({ error: "failed to fetch dog" });
  }
});

app.delete("/dogs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res
      .status(BAD_REQUEST)
      .json({ message: "id should be a number" });
  }
  try {
    const deletedDog = await prisma.dog.delete({
      where: {
        id,
      },
    });
    res.status(OK).json(deletedDog);
  } catch (err) {
    if (
      (err as { code?: string })?.code === "P2025" ||
      (err as Error)?.message?.includes(
        "Record to delete does not exist"
      )
    ) {
      return res.sendStatus(NO_CONTENT);
    }
    console.error(err);
    return res
      .status(INTERNAL_SERVER_ERROR)
      .json({ error: "failed to delete dog" });
  }
});

app.post("/dogs", async (req, res) => {
  const { name, age, description, breed } = req.body;
  const errors: string[] = [];
  const allowedKeys = [
    "name",
    "description",
    "breed",
    "age",
  ];

  for (const key of Object.keys(req.body)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`'${key}' is not a valid key`);
    }
  }

  if (typeof name !== "string") {
    errors.push("name should be a string");
  }
  if (typeof description !== "string") {
    errors.push("description should be a string");
  }
  if (typeof age !== "number") {
    errors.push("age should be a number");
  }
  if (errors.length) {
    return res.status(BAD_REQUEST).json({ errors });
  }
  try {
    const newDog = await prisma.dog.create({
      data: {
        name,
        age,
        description,
        breed,
      },
    });
    res.status(CREATED).json(newDog);
  } catch (e) {
    console.error(e);
    res.status(INTERNAL_SERVER_ERROR);
  }
});

app.patch("/dogs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res
      .status(BAD_REQUEST)
      .json({ message: "id should be a number" });
  }
  const allowedKeys = [
    "name",
    "description",
    "breed",
    "age",
  ];
  const body = req.body ?? {};
  const errors: string[] = [];

  for (const key of Object.keys(body)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`'${key}' is not a valid key`);
    }
  }
  if (errors.length) {
    return res.status(BAD_REQUEST).json({ errors });
  }
  const data = Object.fromEntries(
    Object.entries(body).filter(([k]) =>
      allowedKeys.includes(k)
    )
  );
  try {
    const updatedDog = await prisma.dog.update({
      where: { id },
      data,
    });
    return res.status(OK).json(updatedDog);
  } catch (err) {
    if ((err as { code?: string })?.code === "P2025") {
      return res.sendStatus(NO_CONTENT);
    }
    console.error(err);
    return res
      .status(INTERNAL_SERVER_ERROR)
      .json({ error: "failed to update dog" });
  }
});

// all your code should go above this line
app.use(errorHandleMiddleware);

const port = process.env.NODE_ENV === "test" ? 3001 : 3000;
app.listen(port, () =>
  console.log(`
🚀 Server ready at: http://localhost:${port}
`)
);
