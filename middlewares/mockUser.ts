import { Request, Response, NextFunction } from "express";

export default function mockUser(req: Request, res: Response, next: NextFunction) {
    req.user = {id: 1, username: 'ahmed', password: '0145846874984789'};
    next();
}