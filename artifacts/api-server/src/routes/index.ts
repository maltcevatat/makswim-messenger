import { Router, type IRouter } from "express";
import healthRouter   from "./health.js";
import authRouter     from "./auth.js";
import adminRouter    from "./admin.js";
import chatsRouter    from "./chats.js";
import membersRouter  from "./members.js";
import trainingRouter from "./training.js";
import pushRouter     from "./push.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/admin", adminRouter);
router.use(chatsRouter);
router.use(membersRouter);
router.use(trainingRouter);
router.use(pushRouter);

export default router;
