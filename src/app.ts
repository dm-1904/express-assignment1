import express from "express";
import { prisma } from "../prisma/prisma-instance";
import { errorHandleMiddleware } from "./error-handler";
import "express-async-errors";

const app = express();
app.use(express.json());
// All code should go below this line
// get, delete, post, patch

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello World!" });
});

app.get("/dogs", async (req, res) => {
  const dogs = await prisma.dog.findMany();
  res.send(dogs);
});

app.get("/dogs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res
      .status(400)
      .json({ message: "id should be a number" });
  }
  try {
    const dog = await prisma.dog.findUnique({
      where: { id },
    });
    if (!dog) {
      return res.sendStatus(204);
    }
    return res.status(200).json(dog);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "failed to fetch dog" });
  }
});

app.delete("/dogs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res
      .status(400)
      .json({ message: "id should be a number" });
  }
  try {
    const deletedDog = await prisma.dog.delete({
      where: {
        id,
      },
    });
    res.status(200).json(deletedDog);
  } catch (err) {
    if (
      (err as { code?: string })?.code === "P2025" ||
      (err as Error)?.message?.includes(
        "Record to delete does not exist"
      )
    ) {
      return res.sendStatus(204);
    }
    console.error(err);
    return res
      .status(500)
      .json({ error: "failed to delete dog" });
  }
});

app.post("/dogs", async (req, res) => {
  const body = req.body;
  const errors: string[] = [];
  const allowedKeys = [
    "name",
    "description",
    "breed",
    "age",
  ];
  const name = body?.name;
  const age = body?.age;
  const description = body?.description;

  for (const key of Object.keys(body)) {
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
    return res.status(400).json({ errors });
  }
  try {
    const newDog = await prisma.dog.create({
      data: {
        name: body?.name,
        age: body?.age,
        description: body?.description,
        breed: body?.breed ?? null,
      },
    });
    res.status(201).json(newDog);
  } catch (e) {
    console.error(e);
    res.status(500);
  }
});

app.patch("/dogs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res
      .status(400)
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
    return res.status(400).json({ errors });
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
    return res.status(201).json(updatedDog);
  } catch (err) {
    if ((err as { code?: string })?.code === "P2025") {
      return res.sendStatus(204);
    }
    console.error(err);
    return res
      .status(500)
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
