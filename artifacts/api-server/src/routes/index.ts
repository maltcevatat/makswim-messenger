import { Router, type IRouter } from "express";
import healthRouter  from "./health.js";
import authRouter    from "./auth.js";
import adminRouter   from "./admin.js";
import chatsRouter   from "./chats.js";
import membersRouter from "./members.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminRouter);
router.use(chatsRouter);
router.use(membersRouter);

export default router;
