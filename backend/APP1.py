from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import Document_Parsing
from nlu import nlu_process
from voice import speech_to_text

app = Flask(__name__)
CORS(app)

document_uploaded = False
document_path = None


@app.route('/upload', methods=['POST'])
def upload_document():
    global document_uploaded

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    file_path = os.path.join("uploads", file.filename)
    os.makedirs("uploads", exist_ok=True)
    file.save(file_path)

    Document_Parsing.upload_document(file_path)
    document_uploaded = True
    return jsonify({'message': 'Document uploaded successfully'})

@app.route('/delete-document', methods=['POST'])
def delete_document():
    global document_uploaded, document_path

    try:
        if document_path and os.path.exists(document_path):
            os.remove(document_path)

        document_uploaded = False
        document_path = None

        # Here you would add any additional cleanup
        # Document_Parsing.delete_document()

        return jsonify({'message': 'Document deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/query', methods=['POST'])
def handle_query():
    global document_uploaded
    summary_keywords = ["summary", "summarize", "brief", "short version", "overview"]

    query = request.form.get('query')
    if not query:
        return jsonify({'error': 'No query provided'}), 400

    if document_uploaded:
        # Check if query is document-relevant
        if any(keyword in query.lower() for keyword in summary_keywords):
            response = Document_Parsing.summarize_document()
        else:
            response = Document_Parsing.generate_answer(
                query, Document_Parsing.faiss_index, Document_Parsing.document_texts
            )
            if response is None or response.strip() == "":
                # Fall back to NLU if doc-answering fails or returns empty
                response = nlu_process(query)
    else:
        response = nlu_process(query)

    if response is None:
        return jsonify({'error': 'No response generated'}), 500

    return jsonify({'response': response})

@app.route('/voice', methods=['POST'])
def handle_voice_input():
    result = speech_to_text()
    return jsonify({'response': result})


if __name__ == '__main__':
    app.run(port=5000, debug=True)