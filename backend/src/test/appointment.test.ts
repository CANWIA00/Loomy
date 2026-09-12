import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentController";
import prisma from "../prisma";
import { AuthRequest } from "../middleware/auth";
import { Response } from "express";

jest.mock("../prisma", () => ({
  __esModule: true,
  default: {
    appointment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    team: {
      findFirst: jest.fn(),
    },
  },
}));

function mockRes() {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    body: {},
    params: {},
    query: {},
    user: { id: "u1", email: "a@b.com", role: "ADMIN", companyId: "c1" },
    ...overrides,
  } as AuthRequest;
}

describe("appointment controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAppointments", () => {
    it("returns mapped appointments", async () => {
      (prisma.appointment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          customerName: "Musteri A",
          customerId: 10,
          teamName: "Ekip 1",
          teamId: 5,
          date: "2026-09-10",
          startTime: "09:00",
          duration: 60,
          serviceType: "Bakim",
          notes: "not",
        },
      ]);

      const res = mockRes();
      await getAppointments(mockReq(), res);

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ companyId: "c1" }) })
      );
      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({
          ekip: "Ekip 1",
          ekipId: 5,
          tur: "Bakim",
        }),
      ]);
    });

    it("filters by date and teamId when provided", async () => {
      (prisma.appointment.findMany as jest.Mock).mockResolvedValue([]);

      const req = mockReq({ query: { date: "2026-09-10", teamId: "3" } });
      const res = mockRes();
      await getAppointments(req, res);

      const whereArg = (prisma.appointment.findMany as jest.Mock).mock.calls[0][0].where;
      expect(whereArg.date).toBe("2026-09-10");
      expect(whereArg.teamId).toBe(3);
    });

    it("page + size ile sayfalanmış yanıt döner", async () => {
      (prisma.appointment.count as jest.Mock).mockResolvedValue(3);
      (prisma.appointment.findMany as jest.Mock).mockResolvedValue([
        { id: 2, customerName: "M", teamName: "E", teamId: 5, date: "2026-09-11", startTime: "10:00", duration: 60, serviceType: "Bakim", notes: "" },
      ]);

      const req = mockReq({ query: { page: "1", size: "2" } });
      const res = mockRes();
      await getAppointments(req, res);

      const findManyArg = (prisma.appointment.findMany as jest.Mock).mock.calls[0][0];
      expect(findManyArg.skip).toBe(2);
      expect(findManyArg.take).toBe(2);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.any(Array),
          totalElements: 3,
          totalPages: 2,
          number: 1,
          size: 2,
        })
      );
    });
  });

  describe("createAppointment", () => {
    it("returns 400 when customerName missing", async () => {
      const res = mockRes();
      const req = mockReq({ body: {} });

      await createAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Müşteri adı zorunludur." });
    });

    it("returns 400 when ekipId missing", async () => {
      const res = mockRes();
      const req = mockReq({ body: { customerName: "Musteri" } });

      await createAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Ekip seçimi zorunludur." });
    });

    it("returns 400 when tarih missing", async () => {
      const res = mockRes();
      const req = mockReq({ body: { customerName: "M", ekipId: 1 } });

      await createAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("creates appointment with team name lookup", async () => {
      (prisma.team.findFirst as jest.Mock).mockResolvedValue({
        id: 5,
        name: "Ekip Alpha",
      });
      (prisma.appointment.create as jest.Mock).mockResolvedValue({
        id: 1,
        customerName: "M",
        teamName: "Ekip Alpha",
        teamId: 5,
        date: "2026-09-10",
        startTime: "10:00",
        duration: 30,
        serviceType: "Bakim",
        notes: "",
      });

      const res = mockRes();
      const req = mockReq({
        body: {
          customerName: "M",
          customerId: 10,
          ekipId: 5,
          tarih: "2026-09-10",
          startTime: "10:00",
          duration: 30,
          tur: "Bakim",
          notes: "",
        },
      });

      await createAppointment(req, res);

      expect(prisma.team.findFirst).toHaveBeenCalledWith({
        where: { id: 5, companyId: "c1" },
      });
      const createData = (prisma.appointment.create as jest.Mock).mock.calls[0][0].data;
      expect(createData.teamName).toBe("Ekip Alpha");
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("updateAppointment", () => {
    it("returns 404 when appointment not found", async () => {
      (prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      const req = mockReq({ params: { id: "99" }, body: {} });

      await updateAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Randevu bulunamadı." });
    });

    it("updates appointment and resolves new team name", async () => {
      (prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        teamName: "Eski Ekip",
        teamId: 5,
        customerName: "M",
        customerId: 10,
        date: "2026-09-10",
        startTime: "10:00",
        duration: 30,
        serviceType: "Bakim",
        notes: "",
      });
      (prisma.team.findFirst as jest.Mock).mockResolvedValue({
        id: 9,
        name: "Yeni Ekip",
      });
      (prisma.appointment.update as jest.Mock).mockImplementation(
        async ({ where, data }) => ({
          id: where.id,
          ...data,
        })
      );

      const res = mockRes();
      const req = mockReq({
        params: { id: "1" },
        body: { ekipId: 9 },
      });

      await updateAppointment(req, res);

      const updateData = (prisma.appointment.update as jest.Mock).mock.calls[0][0].data;
      expect(updateData.teamName).toBe("Yeni Ekip");
      expect(updateData.teamId).toBe(9);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("deleteAppointment", () => {
    it("returns 404 when not found", async () => {
      (prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null);

      const res = mockRes();
      const req = mockReq({ params: { id: "99" } });

      await deleteAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("deletes on success", async () => {
      (prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        companyId: "c1",
      });

      const res = mockRes();
      const req = mockReq({ params: { id: "1" } });

      await deleteAppointment(req, res);

      expect(prisma.appointment.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(res.json).toHaveBeenCalledWith({ message: "Randevu silindi." });
    });
  });
});
