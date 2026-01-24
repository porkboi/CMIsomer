"use server"

type EmailParams = {
  to_email: string
  to_name: string
  subject: string
  message: string
  confirmation_link?: string
  party_name?: string
  pos: boolean
}

export async function sendEmail(params: EmailParams): Promise<{ success: boolean; message: string }> {
  try {
    const serviceId = process.env.EMAILJS_SERVICE_ID 
    const templateId = !params.pos ? process.env.EMAILJS_TEMPLATE_ID : process.env.EMAILJS_TEMPLATE_ID_SCH
    const publicKey = process.env.EMAILJS_PUBLIC_KEY
    const privateKey = process.env.EMAILJS_PRIVATE_KEY

    if (!serviceId || !templateId || !publicKey || !privateKey) {
      console.error("Missing EmailJS configuration")
      return { success: false, message: "Email service not configured" }
    }

    // Use the REST API directly instead of the client SDK
    const url = "https://api.emailjs.com/api/v1.0/email/send"

    // Format the request according to EmailJS REST API requirements
    const data = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: {
        to_email: params.to_email,
        to_name: params.to_name,
        subject: params.subject,
        message: params.message,
        confirmation_link: params.confirmation_link,
        party_name: params.party_name,
      },
    }

    // Make the API request
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://localhost", // Required for CORS
      },
      body: JSON.stringify(data),
    })

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text()
      console.error("EmailJS error:", errorText)
      return { success: false, message: `Failed to send email: ${errorText}` }
    }

    return { success: true, message: "Email sent successfully" }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, message: "An error occurred while sending the email" }
  }
}

