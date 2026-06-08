-- CreateTable
CREATE TABLE "Report" (
    "report_id" SERIAL NOT NULL,
    "report_code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "program" "Program",
    "date_from" TIMESTAMP(3) NOT NULL,
    "date_to" TIMESTAMP(3) NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_by" INTEGER NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("report_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_report_code_key" ON "Report"("report_code");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
