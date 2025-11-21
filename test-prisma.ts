
import { PrismaService } from './src/prisma/prisma.service';

async function main() {
    try {
        console.log('Instantiating PrismaService...');
        const prisma = new PrismaService();
        console.log('PrismaService instantiated.');
        await prisma.$disconnect();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
