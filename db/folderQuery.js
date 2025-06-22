const { PrismaClient } = require("@prisma/client");
const { supabase } = require("../supabase/supabase");
const prisma = new PrismaClient();

async function createFolder(folderName, userId, parentId) {
  await prisma.folder.create({
    data: {
      name: folderName,
      userId: userId,
      parentId: parentId,
    },
  });
}

async function getAllFolders() {
  return await prisma.folder.findMany();
}

async function getFolder(userId, folderId) {
  return await prisma.folder.findFirst({
    where: {
      userId: userId,
      id: folderId,
    },
  });
}

async function getNestedFolders(userId, parentId) {
  return await prisma.folder.findMany({
    where: {
      userId: userId,
      parentId: parentId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

async function getFolderRoute(userId, folderId, array = []) {
  if (!folderId) return array;

  const folder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      userId: userId,
    },
  });

  array.push(folder);

  if (folder.parentId) {
    return await getFolderRoute(userId, folder.parentId, array);
  } else {
    return array.reverse();
  }
}

async function deleteFolder(userId, folderId, array = []) {
  array.push(folderId);

  const childrenFolders = await prisma.folder.findMany({
    where: {
      userId: userId,
      parentId: folderId,
    },
  });

  await Promise.all(childrenFolders.map(folder => deleteFolder(userId, folder.id, array)))

  if (folderId === array[0]) {
    const files = await prisma.file.findMany({
      where: {
        folderId: {
          in: array
        }
      }
    })

    await prisma.$transaction(async (tx) => {
      await Promise.all(files.map(file => tx.file.delete({
        where: {
          id: file.id
        }
      })))

      await tx.folder.deleteMany({
        where: {
          id: {
            in: array
          }
        }
      })
    })

    const { data, error } = await supabase.storage
      .from("uploads")
      .remove(files.map(file => file.bucketId));

    return { deletedFolders: array.length, deletedFiles: files.length };
  }

  return null;
}

async function editFolder(userId, folderId, newName) {
  return await prisma.folder.update({
    where: {
      userId: userId,
      id: folderId,
    },
    data: {
      name: newName,
    },
  });
}

module.exports = {
  getAllFolders,
  createFolder,
  getFolder,
  getNestedFolders,
  getFolderRoute,
  deleteFolder,
  editFolder,
};
