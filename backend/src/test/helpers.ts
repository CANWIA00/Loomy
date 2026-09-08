import { Response } from "express";

export function mockRes(): { status: jest.Mock; json: jest.Mock } & Partial<Response> {
  const res = {} as any;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}
