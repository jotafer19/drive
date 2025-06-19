const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function addFile(userId, folderId, name, size, type, bucketId, url) {
    return await prisma.file.create({
        data: {
            name: name,
            size: size,
            type: type,
            bucketId: bucketId,
            URL: url,
            userId: userId,
            folderId: folderId
        }
    })
}

async function getFilesByFolder(userId, folderId) {
    return await prisma.file.findMany({
        where: {
            userId: userId,
            folderId: folderId
        },
        orderBy: {
            createdAt: "asc"
        }
    })
}

async function getFile(userId, fileId) {
    return await prisma.file.findFirst({
        where: {
            id: fileId,
            userId: userId
        }
    })
}

async function editFile(userId, fileId, newName) {
    return await prisma.file.update({
        where: {
            id: fileId,
            userId: userId
        },
        data: {
            name: newName
        }
    })
}

async function deleteFile(userId, fileId) {
    return await prisma.file.delete({
        where: {
            id: fileId,
            userId: userId,
        }
    })
}

module.exports = {
    addFile,
    getFilesByFolder,
    getFile,
    editFile,
    deleteFile
}