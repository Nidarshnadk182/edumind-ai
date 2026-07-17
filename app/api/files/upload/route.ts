import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/database/supabase-server";
import type { ApiResponse } from "@/types/database";

const MAX_SIZE = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          message: "Not authenticated",
        },
      },
      {
        status: 401,
      }
    );
  }

  const formData = await request.formData();

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          message: "No file uploaded.",
        },
      },
      {
        status: 400,
      }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          message: "Maximum upload size is 25 MB.",
        },
      },
      {
        status: 400,
      }
    );
  }

  const extension =
    file.name.split(".").pop()?.toLowerCase() ?? "";

  let extractedText = "";

  switch (extension) {
    case "txt":
    case "md":
    case "csv":
      extractedText = await file.text();
      break;

    case "pdf":
      extractedText =
        `PDF Uploaded

Filename:
${file.name}

Size:
${Math.round(file.size / 1024)} KB

Demo Mode

PDF extraction has not yet been enabled.

The file has been uploaded successfully.

Once pdf-parse or OCR is connected this endpoint will automatically return the real extracted text.

For now you may paste the PDF contents manually.`;

      break;

    case "doc":
    case "docx":
      extractedText =
        `Word document uploaded

Filename:
${file.name}

Demo Mode

DOCX extraction will be enabled once mammoth is installed.

Upload completed successfully.`;

      break;

    default:
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: {
            message:
              "Unsupported file type.",
          },
        },
        {
          status: 400,
        }
      );
  }

  let uploadedFile = null;

  if (isSupabaseConfigured()) {
    const supabase =
      createSupabaseServerClient();

    const { data } = await supabase
      .from("uploaded_files")
      .insert({
        owner_id: session.id,
        file_name: file.name,
        file_type: file.type,
        storage_path: `uploads/${session.id}/${file.name}`,
        size_bytes: file.size,
        extraction_status: "completed",
      })
      .select()
      .single();

    uploadedFile = data;
  }

  return NextResponse.json({
    success: true,
    data: {
      file: uploadedFile,
      fileName: file.name,
      extractedText,
      content: extractedText,
      text: extractedText,
      extractionStatus: "completed",
    },
  });
}
