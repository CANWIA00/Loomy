import { syncQuoteJob, completeQuoteJob } from "../services/quoteJobs";

function makeTx(existingJob: any, quoteStatus = "PENDING") {
  return {
    quoteRecord: {
      update: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn().mockResolvedValue({
        status: quoteStatus,
        id: 7, title: "Kamera Kurulumu", customerName: "Acme", customerId: "cust-1",
        lines: JSON.stringify([{ name: "IP Kamera", quantity: 4, unit: "Adet" }]),
      }),
    },
    appointment: {
      findFirst: jest.fn().mockResolvedValue(existingJob),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 100, ...data })),
      update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...existingJob, ...data })),
    },
  } as any;
}

describe("syncQuoteJob", () => {
  it("kabulde atama bekleyen is olusturur (musteri, baslik, kalem ozeti)", async () => {
    const tx = makeTx(null);
    const r = await syncQuoteJob(tx, "c1", 7, "ACCEPTED");
    expect(r).toEqual({ job: { id: 100, status: "AWAITING" }, warning: null });
    const data = tx.appointment.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ companyId: "c1", quoteId: 7, customerName: "Acme", customerId: "cust-1", serviceType: "Kamera Kurulumu", status: "AWAITING" });
    expect(data.notes).toContain("IP Kamera x4 Adet");
  });

  it("zaten is varsa ikinci kez olusturmaz", async () => {
    const tx = makeTx({ id: 5, status: "SCHEDULED" });
    const r = await syncQuoteJob(tx, "c1", 7, "ACCEPTED");
    expect(r.job).toEqual({ id: 5, status: "SCHEDULED" });
    expect(tx.appointment.create).not.toHaveBeenCalled();
  });

  it("iptal edilmis isi tekrar kabulde atama beklemeye alir", async () => {
    const tx = makeTx({ id: 5, status: "CANCELLED" });
    const r = await syncQuoteJob(tx, "c1", 7, "ACCEPTED");
    expect(r.job).toEqual({ id: 5, status: "AWAITING" });
    expect(tx.appointment.update.mock.calls[0][0].data).toMatchObject({ status: "AWAITING", teamId: null, date: "" });
  });

  it("kabul geri alinirsa atanmamis isi iptal eder", async () => {
    const tx = makeTx({ id: 5, status: "AWAITING" });
    const r = await syncQuoteJob(tx, "c1", 7, "REJECTED");
    expect(r).toEqual({ job: { id: 5, status: "CANCELLED" }, warning: null });
  });

  it("takvimdeki ise dokunmaz, uyari doner", async () => {
    const tx = makeTx({ id: 5, status: "SCHEDULED" });
    const r = await syncQuoteJob(tx, "c1", 7, "PENDING");
    expect(r.warning).toBe("scheduled");
    expect(tx.appointment.update).not.toHaveBeenCalled();
  });

  it("tamamlanmis ise dokunmaz, uyari doner", async () => {
    const tx = makeTx({ id: 5, status: "DONE" });
    const r = await syncQuoteJob(tx, "c1", 7, "REJECTED");
    expect(r.warning).toBe("done");
    expect(tx.appointment.update).not.toHaveBeenCalled();
  });

  it("isi olmayan teklif reddedilirse bir sey yapmaz", async () => {
    const tx = makeTx(null);
    const r = await syncQuoteJob(tx, "c1", 7, "REJECTED");
    expect(r).toEqual({ job: null, warning: null });
  });
});

describe("completeQuoteJob (tekliften servis kaydi)", () => {
  it("isi olmayan teklifi kabul eder ve tamamlanmis is olusturur", async () => {
    const tx = makeTx(null);
    await completeQuoteJob(tx, "c1", 7, 300);
    expect(tx.quoteRecord.update.mock.calls[0][0].data.status).toBe("ACCEPTED");
    expect(tx.appointment.create.mock.calls[0][0].data).toMatchObject({ quoteId: 7, status: "DONE", serviceRecordId: 300, customerName: "Acme" });
  });

  it("iptal edilmis isi tamamlar", async () => {
    const tx = makeTx({ id: 5, status: "CANCELLED" }, "REJECTED");
    await completeQuoteJob(tx, "c1", 7, 300);
    expect(tx.appointment.update).toHaveBeenCalledWith({ where: { id: 5 }, data: { status: "DONE", serviceRecordId: 300 } });
    expect(tx.appointment.create).not.toHaveBeenCalled();
  });

  it("tamamlanmis ise ve kabul edilmis teklife dokunmaz", async () => {
    const tx = makeTx({ id: 5, status: "DONE" }, "ACCEPTED");
    await completeQuoteJob(tx, "c1", 7, 301);
    expect(tx.quoteRecord.update).not.toHaveBeenCalled();
    expect(tx.appointment.update).not.toHaveBeenCalled();
    expect(tx.appointment.create).not.toHaveBeenCalled();
  });
});
