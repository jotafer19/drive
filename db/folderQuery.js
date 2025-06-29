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

  if (!folder) return;

  array.push(folder);

  if (!folder.parentId) {
    return array.reverse();
  } else {
    return await getFolderRoute(userId, folder.parentId, array);
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

  await Promise.all(
    childrenFolders.map((folder) => deleteFolder(userId, folder.id, array)),
  );

  if (folderId === array[0]) {
    const files = await prisma.file.findMany({
      where: {
        folderId: {
          in: array,
        },
      },
    });

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        files.map((file) =>
          tx.file.delete({
            where: {
              id: file.id,
            },
          }),
        ),
      );

      await tx.folder.deleteMany({
        where: {
          id: {
            in: array,
          },
        },
      });
    });

    const { data, error } = await supabase.storage
      .from("uploads")
      .remove(files.map((file) => file.bucketId));

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

async function getSharedLink(sharedLinkId) {
  return await prisma.shareLink.findFirst({
    where: {
      id: sharedLinkId
    }
  })
}

async function postSharedLink(userId, folderId, expiresAt) {
  return prisma.shareLink.create({
    data: {
      userId,
      folderId,
      expiresAt
    }
  })
}

async function allowedFolders(userId, rootFolderId, array = []) {
  const children = await prisma.folder.findMany({
    where: {
      userId,
      parentId: rootFolderId
    }
  })

  array.push(...children.map(folder => folder.id))

  await Promise.all(children.map(folder => allowedFolders(userId, folder.id, array)))

  return array;
}

module.exports = {
  getAllFolders,
  createFolder,
  getFolder,
  getNestedFolders,
  getFolderRoute,
  deleteFolder,
  editFolder,
  getSharedLink,
  postSharedLink,
  allowedFolders
};
