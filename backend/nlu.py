from openai import OpenAI

# Configure OpenAI client for OpenRouter
client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key="",  # Replace with your API key
)

# Define the function to generate marketing emails
def nlu_process(user_input,tone="Authoritative", prompt_type=1):
    # Define the prompts
    prompt1 = f"""
    You are a domain expert in electronics. Answer the question concisely in a tone of {tone}. The question is: {user_input}. 
    Limit the response to around  70 to 80 words, formatted correctly, and avoid any extra matter. 
    Provide a brief yet compreh n   ensive explanation in 3 to 5 lines in the same language as input ,if the questions are not related to electronocs just answer I specialized in Electronics. Please ask a related question.
    """


    # Generate the email using the selected prompt
    completion = client.chat.completions.create(
        extra_body={},
        model="qwen/qwen2.5-vl-72b-instruct:free",
        messages=[
            {
                "role": "user",
                "content":prompt1
            }
        ]
    )

    # Extract the generated email content
    email_content = completion.choices[0].message.content
    return email_content

