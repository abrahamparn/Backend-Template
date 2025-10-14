import express from "express";
import usersController from "./users.controller.js";
import { authMiddleware } from "../../../infra/security/auth.middleware.js";
import { authorize } from "../../middleware/authorization.middleware.js";
import { Role } from "@prisma/client";
const router = express.Router();

//? if you want to move from this to RBAC.
//? i need you to change the strings to database rbac but if you don't want it
//? then use enum

router.use(authMiddleware);

router.get("/", usersController.getUsers);
router.get("/:id", usersController.getUserById);
router.post("/", authorize([Role.ADMIN, Role.SUPER_ADMIN]), usersController.createUser);
router.patch("/:id", authorize(["ADMIN", "SUPER_ADMIN"]), usersController.updateUser);
router.delete("/:id", authorize(["SUPER_ADMIN"]), usersController.deleteUser);

export { router as usersRouter };
