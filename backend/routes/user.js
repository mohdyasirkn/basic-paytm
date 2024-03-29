const express = require("express");
const zod = require("zod");
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config");
const { authMiddleware } = require("../middleware");
const router = express.Router();

const signupSchema = zod.object({
  username: zod.string().email(),
  password: zod.string(),
  firstName: zod.string(),
  lastName: zod.string(),
});

const signinSchema = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});

const userUpdateSchema = zod.object({
  password: zod.string().optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
});

//
//Routes
//signup route
router.post("/signup", async (req, res) => {
  const { success } = signupSchema.safeParse(req.body);
  if (!success) {
    return res.status(411).json({
      message: "Email already taken / Incorrect inputs",
    });
  }

  const existingUser = await User.findOne({ username: req.body.username });

  if (existingUser) {
    return res.status(411).json({
      message: "Email already taken / Incorrect inputs",
    });
  }

  const user = await User.create({
    username: req.body.username,
    password: req.body.password,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
  });
  userId = user._id;

  await Account.create({
    userId,
    balance: 1 + Math.random() * 1000,
  });

  const token = jwt.sign({ userId }, JWT_SECRET);

  res.status(200).json({
    message: "User created successfully",
    token: token,
  });
});

//signin route
router.post("/signin", async (req, res) => {
  const body = req.body;
  const { success } = signinSchema.safeParse(req.body);

  if (!success) {
    return res.status(411).json({
      message: "Email already taken / Incorrect inputs",
    });
  }

  const user = User.findOne({
    username: body.username,
    password: body.password,
  });

  if (user) {
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);

    res.json({ token: token });
    return;
  }

  res.status(411).json({
    message: "Error while logging in",
  });
});

//User Update route
router.put("/", authMiddleware, async (req, res) => {
  body = req.body;
  const { success } = userUpdateSchema.safeParse(body);
  if (!success) {
    res.status(411).json({
      message: "Error while updating information",
    });
  }

  await User.updateOne({ _id: userId }, body);

  res.status(200).json({
    message: "Updated successfully",
  });
});

//Users Retrieval Route
router.get("/bulk", async (req, res) => {
  const filter = req.query.filter;

  const users = await User.find({
    $or: [{ firstName: { $regex: filter } }, { lastName: { $regex: filter } }],
  });

  res.json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstName,
      lastame: user.lastName,
      _id: user._id,
    })),
  });
});

module.exports = router;
