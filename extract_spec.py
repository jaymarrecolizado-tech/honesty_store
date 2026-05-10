from docx import Document

doc = Document('Electronic_Honesty_Store_SDD_v1_5.docx')
text = '\n'.join([para.text for para in doc.paragraphs if para.text.strip()])

with open('spec.txt', 'w', encoding='utf-8') as f:
    f.write(text)