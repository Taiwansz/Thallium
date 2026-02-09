from fpdf import FPDF
from io import BytesIO
from flask import send_file

def gerar_recibo_pdf(transacao, cliente):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    # Header
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt="Thalium Bank - Comprovante", ln=1, align='C')
    pdf.ln(10)

    # Details
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt=f"Data: {transacao.data_transacao.strftime('%d/%m/%Y %H:%M:%S')}", ln=1)
    pdf.cell(200, 10, txt=f"Tipo: {transacao.tipo_transacao}", ln=1)
    pdf.cell(200, 10, txt=f"Valor: R$ {transacao.valor:,.2f}", ln=1)
    pdf.cell(200, 10, txt=f"Descrição: {transacao.descricao or '-'}", ln=1)
    pdf.cell(200, 10, txt=f"Categoria: {transacao.categoria}", ln=1)

    pdf.ln(10)
    pdf.cell(200, 10, txt=f"Autenticação: {transacao.id_transacao}-{cliente.id_cliente}", ln=1)

    pdf.ln(20)
    pdf.set_font("Arial", 'I', 10)
    pdf.cell(200, 10, txt="Este documento é apenas uma simulação.", ln=1, align='C')

    pdf_output = BytesIO()
    pdf.output(pdf_output)
    pdf_output.seek(0)

    return send_file(pdf_output, as_attachment=True, download_name=f"comprovante_{transacao.id_transacao}.pdf", mimetype='application/pdf')
