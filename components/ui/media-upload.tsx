"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MediaUploadProps {
  initialImages?: string[];
  onChange?: (files: File[]) => void;
  multipleUpload?: boolean;
  multiplePreview?: boolean;
  className?: string;
  enableRemove?: boolean
}

export default function MediaUpload({
  initialImages = [],
  onChange,
  multipleUpload = false,
  multiplePreview = true,
  className,
  enableRemove = false
}: MediaUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(initialImages);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;


    const newFiles = [...selectedFiles, ...files];
    setFiles(newFiles);
    onChange?.(newFiles);

    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if(multiplePreview){
          setPreviews((prev) => [reader.result as string, ...prev]);
        }else{
          setPreviews([reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    setFiles(newFiles);
    setPreviews(newPreviews);
    onChange?.(newFiles);
  };

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {/* Upload Zone */}
      <label className="relative w-[90px] h-[90px] border rounded-[15px] overflow-hidden shadow-[0px_1.88px_3.76px_0px_#1018280D] flex items-center justify-center cursor-pointer hover:border-gray-400 transition group">
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.834 10.8334V14.1667C15.834 14.6087 15.6584 15.0327 15.3458 15.3452C15.0333 15.6578 14.6093 15.8334 14.1673 15.8334H2.50065C2.05862 15.8334 1.6347 15.6578 1.32214 15.3452C1.00958 15.0327 0.833984 14.6087 0.833984 14.1667V10.8334M12.5007 5.00004L8.33398 0.833374M8.33398 0.833374L4.16732 5.00004M8.33398 0.833374V10.8334" stroke="#344054" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <input
          type="file"
          accept="image/*"
          multiple={multipleUpload}
          onChange={handleFile}
          className="hidden"
        />
      </label>

      {/* initialImages */}
      {previews.map((preview, index) => (
        <div key={index} className="relative group w-[90px] h-[90px]">
          <Image
            src={preview}
            alt={`Upload ${index + 1}`}
            width={90}
            height={90}
            className="w-full h-full object-cover rounded-[15px] shadow-[0px_1.88px_3.76px_0px_#1018280D]"
          />

          {/* Overlay */}
          {enableRemove && (
            <div className="absolute inset-0 opacity-0 bg-white/40 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
              <button
                onClick={() => removeImage(index)}
                className="transition cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.99996H4.16667M4.16667 4.99996H17.5M4.16667 4.99996V16.6666C4.16667 17.1087 4.34226 17.5326 4.65482 17.8451C4.96738 18.1577 5.39131 18.3333 5.83333 18.3333H14.1667C14.6087 18.3333 15.0326 18.1577 15.3452 17.8451C15.6577 17.5326 15.8333 17.1087 15.8333 16.6666V4.99996H4.16667ZM6.66667 4.99996V3.33329C6.66667 2.89127 6.84226 2.46734 7.15482 2.15478C7.46738 1.84222 7.89131 1.66663 8.33333 1.66663H11.6667C12.1087 1.66663 12.5326 1.84222 12.8452 2.15478C13.1577 2.46734 13.3333 2.89127 13.3333 3.33329V4.99996" stroke="#344054" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}