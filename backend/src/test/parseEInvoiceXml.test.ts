import { parseEInvoiceXml, resolveUnit } from "../utils/parseEInvoiceXml";

const WRAP = (lineXml: string, header = "") => `<?xml version="1.0"?>
<Invoice xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <ID>INV-2026-001</ID>
  <IssueDate>2026-09-10</IssueDate>
  <AccountingSupplierParty>
    <Party>
      <PartyLegalEntity>
        <RegistrationName>TEDAŞ ELEKTRİK</RegistrationName>
        <CompanyID>1234567890</CompanyID>
      </PartyLegalEntity>
    </Party>
  </AccountingSupplierParty>
  <TaxTotal><TaxAmount currencyID="TRY">118.24</TaxAmount></TaxTotal>
  <LegalMonetaryTotal><PayableAmount currencyID="TRY">709.43</PayableAmount></LegalMonetaryTotal>
  ${header}
  ${lineXml}
</Invoice>`;

describe("parseEInvoiceXml", () => {
  describe("KDV oranı çıkarımı", () => {
    it("KDV %sini TaxSubtotal.Percent'ten çıkarır (kullanıcının gerçek dosya yapısı)", () => {
      // Gerçek e-faturadaki yapı: Percent, TaxCategory içinde DEĞİL, TaxSubtotal altında
      const xml = WRAP(`
        <InvoiceLine>
          <ID>2</ID>
          <InvoicedQuantity unitCode="C62">8</InvoicedQuantity>
          <LineExtensionAmount currencyID="TRY">591.19</LineExtensionAmount>
          <TaxTotal>
            <TaxAmount currencyID="TRY">118.23800</TaxAmount>
            <TaxSubtotal>
              <TaxableAmount currencyID="TRY">591.19</TaxableAmount>
              <TaxAmount currencyID="TRY">118.23800</TaxAmount>
              <CalculationSequenceNumeric>1</CalculationSequenceNumeric>
              <Percent>20</Percent>
              <TaxCategory>
                <TaxScheme><Name>KDV</Name><TaxTypeCode>0015</TaxTypeCode></TaxScheme>
              </TaxCategory>
            </TaxSubtotal>
          </TaxTotal>
          <Item><Name>EFİRE-STANDART DEDEKTÖR SOKETİ</Name></Item>
          <Price><PriceAmount currencyID="TRY">73.89875</PriceAmount></Price>
        </InvoiceLine>`);

      const r = parseEInvoiceXml(xml);
      expect(r.lines).toHaveLength(1);
      expect(r.lines[0].vatRate).toBe(20);
      expect(r.lines[0].unitPrice).toBe(73.89875);
      expect(r.lines[0].quantity).toBe(8);
      expect(r.lines[0].unit).toBe("AD");
    });

    it("KDV %sini Item.ClassifiedTaxCategory.Percent'ten çıkarır (standart GIB yapısı)", () => {
      const xml = WRAP(`
        <InvoiceLine>
          <ID>1</ID>
          <InvoicedQuantity unitCode="KGM">2</InvoicedQuantity>
          <LineExtensionAmount currencyID="TRY">200</LineExtensionAmount>
          <Item>
            <Name>Test Ürün</Name>
            <ClassifiedTaxCategory>
              <ID>S</ID>
              <Percent>18</Percent>
              <TaxScheme><Name>KDV</Name></TaxScheme>
            </ClassifiedTaxCategory>
          </Item>
          <Price><PriceAmount currencyID="TRY">100</PriceAmount></Price>
        </InvoiceLine>`);

      const r = parseEInvoiceXml(xml);
      expect(r.lines[0].vatRate).toBe(18);
      expect(r.lines[0].unit).toBe("KG");
    });

    it("KDV oranı hiç yoksa 0 varsayılır", () => {
      const xml = WRAP(`
        <InvoiceLine>
          <ID>1</ID>
          <InvoicedQuantity unitCode="C62">1</InvoicedQuantity>
          <LineExtensionAmount currencyID="TRY">50</LineExtensionAmount>
          <Item><Name>Fiyatsız ürün</Name></Item>
        </InvoiceLine>`);

      const r = parseEInvoiceXml(xml);
      expect(r.lines[0].vatRate).toBe(0);
      expect(r.lines[0].unitPrice).toBe(50);
    });

    it("birden fazla satırı ayırır ve her birinin KDV sini ayrı okur", () => {
      const xml = WRAP(`
        <InvoiceLine>
          <ID>1</ID>
          <InvoicedQuantity unitCode="C62">1</InvoicedQuantity>
          <LineExtensionAmount currencyID="TRY">100</LineExtensionAmount>
          <Item>
            <Name>Ürün A</Name>
            <ClassifiedTaxCategory><Percent>10</Percent></ClassifiedTaxCategory>
          </Item>
          <Price><PriceAmount currencyID="TRY">100</PriceAmount></Price>
        </InvoiceLine>
        <InvoiceLine>
          <ID>2</ID>
          <InvoicedQuantity unitCode="C62">2</InvoicedQuantity>
          <LineExtensionAmount currencyID="TRY">200</LineExtensionAmount>
          <Item>
            <Name>Ürün B</Name>
            <ClassifiedTaxCategory><Percent>20</Percent></ClassifiedTaxCategory>
          </Item>
          <Price><PriceAmount currencyID="TRY">100</PriceAmount></Price>
        </InvoiceLine>`);

      const r = parseEInvoiceXml(xml);
      expect(r.lines).toHaveLength(2);
      expect(r.lines[0].vatRate).toBe(10);
      expect(r.lines[1].vatRate).toBe(20);
    });
  });

  describe("fatura başlığı bilgileri", () => {
    it("fatura no, tarih, tedarikçi, toplam, KDV tutarı ve para birimini çıkarır", () => {
      const xml = WRAP(`
        <InvoiceLine>
          <ID>1</ID>
          <InvoicedQuantity unitCode="C62">1</InvoicedQuantity>
          <LineExtensionAmount currencyID="TRY">591.19</LineExtensionAmount>
          <Item><Name>Ürün</Name></Item>
        </InvoiceLine>`);

      const r = parseEInvoiceXml(xml);
      expect(r.invoiceNo).toBe("INV-2026-001");
      expect(r.date).toBe("2026-09-10");
      expect(r.supplierName).toBe("TEDAŞ ELEKTRİK");
      expect(r.supplierTaxNumber).toBe("1234567890");
      expect(r.totalAmount).toBe(709.43);
      expect(r.vatAmount).toBe(118.24);
      expect(r.currency).toBe("TRY");
    });
  });

  describe("birim kodları", () => {
    it("UBL birim kodlarını Türkçe karşılıklarına eşler", () => {
      expect(resolveUnit("C62")).toBe("AD");
      expect(resolveUnit("KGM")).toBe("KG");
      expect(resolveUnit("LTR")).toBe("LT");
      expect(resolveUnit("MTQ")).toBe("M3");
      expect(resolveUnit(null)).toBe("AD");
      expect(resolveUnit("XYZ")).toBe("XYZ");
    });
  });

  describe("XML sınırları", () => {
    it("bilinmeyen kök öğesi olan XML boş satır ve BİLİNMEYEN no ile döner", () => {
      const r = parseEInvoiceXml("<Foo></Foo>");
      expect(r.invoiceNo).toBe("BİLİNMEYEN");
      expect(r.lines).toEqual([]);
    });

    it("satır yoksa boş liste döner", () => {
      const r = parseEInvoiceXml(WRAP(""));
      expect(r.lines).toEqual([]);
    });
  });
});