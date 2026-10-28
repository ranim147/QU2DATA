import { ApolloError } from "apollo-server-express";
import { Page } from "./model";
import { PAGE_FORMAT_DIMENSIONS } from "./constants";
import {
  CreatePageInput,
  DeletePageInput,
  GetPagesInput,
  UpdatePageInput,
} from "./types";

export const createDefaultPageForProject = async (
  projectId: string,
  transaction?: any
) => {
  const defaultFormat = "SIXTEEN_NINE";
  const presetDimensions = PAGE_FORMAT_DIMENSIONS[defaultFormat];

  return await Page.create(
    {
      title: "Vue d'ensemble",
      format: defaultFormat,
      width: presetDimensions ? presetDimensions.width : 1280,
      height: presetDimensions ? presetDimensions.height : 720,
      orderIndex: 0,
      projectId,
    },
    transaction ? { transaction } : undefined
  );
};

export const getPages = async (input: GetPagesInput) => {
  const { projectId } = input;

  let pages = await Page.findAll({
    where: { projectId },
    order: [["orderIndex", "ASC"]],
  });

  // Filet de sécurité : si le projet n'a encore aucune page
  // on lui en crée une par défaut à la volée.
  if (pages.length === 0) {
    const defaultPage = await createDefaultPageForProject(projectId);
    pages = [defaultPage];
  }

  return pages;
};

export const createPage = async (input: CreatePageInput) => {
  try {
    const { projectId, title, format, width, height } = input;

    const pageCount = await Page.count({ where: { projectId } });

    const resolvedFormat = format || "SIXTEEN_NINE";
    const presetDimensions = PAGE_FORMAT_DIMENSIONS[resolvedFormat];

    // Si un format standard est choisi, ses dimensions priment.
    // Si CUSTOM (ou format inconnu), on utilise width/height fournis par l'utilisateur.
    const finalWidth = presetDimensions ? presetDimensions.width : (width || 1280);
    const finalHeight = presetDimensions ? presetDimensions.height : (height || 720);

    const page = await Page.create({
      title: title || `Page ${pageCount + 1}`,
      format: resolvedFormat,
      width: finalWidth,
      height: finalHeight,
      orderIndex: pageCount,
      projectId,
    });

    return {
      success: true,
      message: "PAGE CREATED",
      page,
    };
  } catch (error: any) {
    console.error("Page creation failed:", error);
    return {
      success: false,
      message: "PAGE CREATION FAILED",
      page: null,
    };
  }
};

export const updatePage = async (input: UpdatePageInput) => {
  try {
    const { pageId, format, width, height, ...rest } = input;

    const page = await Page.findByPk(pageId);

    if (!page) {
      throw new ApolloError("PAGE NOT FOUND");
    }

    let fields: any = { ...rest };

    if (format) {
      const presetDimensions = PAGE_FORMAT_DIMENSIONS[format];
      fields.format = format;

      if (presetDimensions) {
        // Format standard → dimensions imposées, on ignore width/height envoyés
        fields.width = presetDimensions.width;
        fields.height = presetDimensions.height;
      } else {
        // CUSTOM → on respecte les dimensions envoyées par l'utilisateur
        if (width) fields.width = width;
        if (height) fields.height = height;
      }
    } else if (width || height) {
      // L'utilisateur redimensionne à la main sans changer le format explicitement
      // → on bascule automatiquement en CUSTOM pour rester cohérent
      fields.format = "CUSTOM";
      if (width) fields.width = width;
      if (height) fields.height = height;
    }

    await page.update(fields);

    return {
      success: true,
      message: "PAGE UPDATED",
      page,
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        success: false,
        message: error.message,
        page: null,
      };
    }
    throw error;
  }
};

export const deletePage = async (input: DeletePageInput) => {
  try {
    const { pageId } = input;

    const page = await Page.findByPk(pageId);

    if (!page) {
      throw new ApolloError("PAGE NOT FOUND");
    }

    const { projectId } = page;

    await page.destroy();

    // Réindexation des pages restantes pour éviter les trous dans orderIndex
    const remainingPages = await Page.findAll({
      where: { projectId },
      order: [["orderIndex", "ASC"]],
    });

    await Promise.all(
      remainingPages.map((p: any, index: number) => p.update({ orderIndex: index }))
    );

    return {
      success: true,
      message: "PAGE DELETED",
    };
  } catch (error: any) {
    if (error instanceof ApolloError) {
      return {
        success: false,
        message: error.message,
      };
    }
    throw error;
  }
};