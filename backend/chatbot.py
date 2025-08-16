from nlu import nlu_process
from voice import speech_to_text, text_to_speech
import Document_Parsing
import os

def get_user_input():
    choice = input("Do you want to use voice input? (yes/no): ").strip().lower()
    if choice == "yes":
        return speech_to_text()
    else:
        return input("Enter your query: ")

def upload_document():
    while True:
        file_path = input("Enter the file path: ").strip()
        if os.path.exists(file_path):
            Document_Parsing.upload_document(file_path)
            print("Document uploaded successfully!")
            return True
        else:
            print("[ERROR] File not found.")
            retry = input("Do you want to try again? (yes/no): ").strip().lower()
            if retry != "yes":
                return Falseyes


def main():
    document_uploaded = False

    upload_choice = input("Do you want to upload a document? (yes/no): ").strip().lower()
    if upload_choice == "yes":
        document_uploaded = upload_document()

    summary_keywords = ["summary", "summarize", "brief", "short version", "overview"]

    while True:
        user_query = get_user_input()

        if user_query.lower() in ["exit", "quit", "done", "thank you"]:
            print("Exiting the assistant. Goodbye!")
            break

        if document_uploaded:
            if any(keyword in user_query.lower() for keyword in summary_keywords):
                response = Document_Parsing.summarize_document()
            else:
                response = Document_Parsing.generate_answer(user_query, Document_Parsing.faiss_index,
                                                            Document_Parsing.document_texts)
        else:
            response = nlu_process(user_query)

        if response is None:
            print("[ERROR] No response generated. Please try again.")
            continue

        text_to_speech(response)

        if document_uploaded:
            use_document = input(
                "Do you want to continue with the uploaded document for the next query? (yes/no): ").strip().lower()
            if use_document != "yes":
                document_uploaded = False


if __name__ == "__main__":
    main()