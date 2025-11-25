-- CreateTable
CREATE TABLE "Proxy" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "host" TEXT,
    "port" INTEGER,
    "protocol" TEXT DEFAULT 'http',
    "username" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proxy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proxy_sessionId_key" ON "Proxy"("sessionId");

-- AddForeignKey
ALTER TABLE "Proxy" ADD CONSTRAINT "Proxy_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
