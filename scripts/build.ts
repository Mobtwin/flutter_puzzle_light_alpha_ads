import fs from "fs";
import path from "path";
import axios from "axios";
import { ANDROID_MANIFEST, BUILD_GRADLE } from "./template";
export interface IAds {
  provider: "Admob" | "Facebook Audience Network" | "Unity Ads" | "AppLovin" | "UnityAds";
  appId?: string;
  smartBanner?: string;
  nativeAds?: string;
  interstitial?: string;
  rewardedVideo?: string;
  token?: string;
  priority?: number;
}
export interface IStepContent {
  poster: string;
  title: string;
  description: string;
}
export interface IStep {
  index: number;
  content: IStepContent;
}

export interface IPuzzle {
  images: string[];
  level: "easy" | "medium" | "hard";
}
export interface AdsPriority {
  network:string;
  priority:number;
  interstitial?:string;
  native?:string;
  banner?:string;
  app_id?:string;
}
async function downloadFile(
  url: string,
  outputPath: string,
  query?: string
): Promise<string | null> {
  try {
    let response;
    if (query) {
      response = await axios({
        url,
        method: "GET",
        responseType: "stream",
        params:{
          userId: query 
        }
      });
    } else {
      response = await axios({
        url,
        method: "GET",
        responseType: "stream",
      });
    }

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(outputPath));
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(`Failed to download file from ${url}:`, error);
    return null;
  }
}

const saveToJson = async ({
  about = "path_to",
  app_icon,
  app_name,
  contact = "contact@email.com",
  puzzles,
  intro,
  main_color,
  privacy = "path_to",
  splash_url,
  terms = "path_to",
  ad_priority,

}: {
  puzzles: IPuzzle[];
  app_name: string;
  app_icon: string;
  splash_url: string;
  main_color: string;
  contact: string;
  about: string;
  privacy: string;
  terms: string;
  intro: IStep[];
  ad_priority: AdsPriority[];

}) => {
  const filePath = path.join(__dirname, "..", "assets", "db.json");
  const dbData: {
    puzzles: any[];
    app_name: string;
    app_icon: string;
    cover: string;
    main_color: string;
    contact: string;
    about: string;
    privacy: string;
    terms: string;
    intro: any[];
    ad_priority: AdsPriority[];

  } = {
    puzzles,
    app_name,
    app_icon,
    cover:splash_url,
    main_color,
    contact,
    about,
    privacy,
    terms,
    intro:intro.map(i => ({title:i.content.title,description:i.content.description,icon:i.content.poster})),
    ad_priority

  };

  try {
    await fs.promises.writeFile(filePath, JSON.stringify(dbData, null, 2));
    console.log("Database saved successfully!");
  } catch (error) {
    console.error("Failed to save database:", error);
  }
};


const downloadAssets = async (puzzles: IPuzzle[], userId: string): Promise<IPuzzle[]> => {
  const assetsDir = path.join(__dirname, "..", "assets");
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
  }

  const downloadPromises = puzzles.map(async (item) => {
    const newImages: string[] = [];
    item.images.map(async (image) => {
      const imagePath = path.join(assetsDir, image.split("/").pop()!);
      await downloadFile(image, imagePath, userId);
      newImages.push(imagePath.split("/").slice(-2).join("/"));
    });
    return {
      ...item,
      images: newImages,
    }

  });

  try {
    const newContent = await Promise.all(downloadPromises);
    console.log("Assets downloaded successfully!");
    return newContent;
  } catch (error) {
    console.error("Failed to download assets:", error);
    return []; // Return an empty array on failure
  }
};




const downloadIntro = async (intro: IStep[]) => {
  const assetsDir = path.join(__dirname, "..", "assets");
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
  }

  const newIntro: IStep[] = [];

  const downloadPromises = intro.map(async (item) => {
    const iconPath = path.join(assetsDir, item.content.poster.split("/").pop()!);

    await downloadFile(item.content.poster, iconPath);

    newIntro.push({
      index: item.index,
      content:{
        ...item.content,
        poster: iconPath.split("/").slice(-2).join("/")
      },
    });
  });

  try {
    await Promise.all(downloadPromises);
    console.log("Intro posters downloaded successfully!");
    return newIntro;
  } catch (error) {
    console.error("Failed to download Intro posters:", error);
  }
};

function createKeyPropertiesFile({
  keyPassword,
  storeFile,
  storePassword,
  keyAlias,
}: {
  storePassword: string;
  keyPassword: string;
  storeFile: string;
  keyAlias: string;
}) {
  const storePath = path.join(
    __dirname,
    "..",
    "android",
    "app",
    storeFile
  );
  const keyPropertiesContent = `
  storePassword=${storePassword}
  keyPassword=${keyPassword}
  keyAlias=${keyAlias}
  storeFile=${storePath}
  `;

  // Define the path for the key.properties file
  const keyPropertiesFilePath = path.join(
    __dirname,
    "..",
    "android",
    "key.properties"
  );

  // Write the key.properties file
  fs.writeFileSync(keyPropertiesFilePath, keyPropertiesContent.trim(), "utf8");

  console.log(`key.properties file created at ${keyPropertiesFilePath}`);
}

function replaceGradleFile() {
  // Path to the build.gradle file
  const gradleFilePath = path.join(
    __dirname,
    "..",
    "android",
    "app",
    "build.gradle"
  );

  try {
    // Write the new content to the build.gradle file, overwriting the existing file
    fs.writeFileSync(gradleFilePath, BUILD_GRADLE, "utf8");

    console.log(`Replaced build.gradle file at ${gradleFilePath}`);
  } catch (error) {
    console.error(`Failed to replace build.gradle file: ${error}`);
  }
}
function replaceManifestXML({
  applicationName = "${applicationName}",
  admobAppId = "ca-app-pub-3940256099942544~3347511713",
  unityGameId = "5712423",
  applovinSDKKey = "lv0C9ThoCyfGpyWxTbIaL9CW2ZnBnE7ShD_Ae4y8XEq41bsvIgfIMnmqfKC8PTTaz_BbB_betbZ654QrCA9PKI",
}:{applicationName?:string,
    admobAppId?: string,
    unityGameId?: string,
    applovinSDKKey?: string,
  }) {
  // Path to the manifest.xml file
  const manifestXMLFilePath = path.join(
    __dirname,
    "..",
    "android",
    "app",
    "src",
    "main",
    "AndroidManifest.xml"
  );

  const ANDROID_MANIFEST_XML = ANDROID_MANIFEST({ admobAppId,applicationName,unityGameId,applovinSDKKey });
  try {
    // Write the new content to the androidManifest.xml file, overwriting the existing file
    fs.writeFileSync(manifestXMLFilePath, ANDROID_MANIFEST_XML, "utf8");

    console.log(`Replaced AndroidManifest.xml file at ${manifestXMLFilePath}`);
  } catch (error) {
    console.error(`Failed to replace AndroidManifest.xml file: ${error}`);
  }
}
const main = async () => {
  const metadata = JSON.parse(process.env.METADATA || "{}");

  const content: IPuzzle[] = metadata.content;
  const intro: IStep[] = metadata.intro;
  const about = "https://via.placeholder.com/150";
  const privacy = "https://via.placeholder.com/150";
  const terms = "https://via.placeholder.com/150";
  const contact = "contact@mobtwin.com";
  const app_name = process.env.APP_NAME || "Flutter Fake Call";
  const userId = process.env.USER_ID || "";
  const app_icon = metadata.icon || "https://via.placeholder.com/150";
  const splash_url = metadata.cover || "https://via.placeholder.com/150";
  const main_color = metadata.mainColor || "#000000";

  const keyPassword = process.env.KEY_PASSWORD || "password";
  const storePassword = process.env.KEY_PASSWORD || "password";
  const keyAlias = process.env.KEY_ALIAS || "key";
  const storeFile = process.env.KEYSTORE_FILE || "key-key.jks";

  const preAds = metadata.ads as IAds[] || [];
  const ads = preAds.map((a) => {
    if (a.provider === "Unity Ads") {
      return {
        ...a,
        provider: "UnityAds",
      } as IAds;
    }
    return a;
  });

  const downloadedIcon = await downloadFile(
    app_icon,
    path.join(__dirname, "..", "assets", "icons", "icon.png")
  );
  const downloadedSplash = await downloadFile(
    splash_url,
    path.join(__dirname, "..", "assets", splash_url.split("/").pop()!)
  );

  const newContent = await downloadAssets(content,userId);
  const newIntro = await downloadIntro(intro);

  if (!newContent || newContent.length === 0) {
    console.error("Failed to download assets, exiting...");
    return;
  }
  if (!newIntro || newIntro.length === 0) {
    console.error("Failed to download intro assets, exiting...");
    return;
  }

  await saveToJson({
    puzzles: newContent,
    app_name: app_name,
    app_icon: downloadedIcon?.split("/").slice(-3).join("/")||"assets/icons/icon.png",
    splash_url: downloadedSplash?.split("/").slice(-2).join("/")!,
    main_color: main_color,
    contact: contact,
    about: about,
    privacy: privacy,
    terms: terms,
    intro: newIntro,
    ad_priority: ads.map((a:IAds) => ({priority:a.priority,network:a.provider,app_id:a.appId,banner:a.smartBanner,interstitial:a.interstitial,native:a.nativeAds} as AdsPriority))

  });

  createKeyPropertiesFile({ keyAlias, keyPassword, storePassword, storeFile });
  replaceGradleFile();
  replaceManifestXML({admobAppId:ads.find(a => a.provider === "Admob")?.appId,applovinSDKKey:ads.find(a => a.provider === "AppLovin")?.appId,unityGameId:ads.find(a => a.provider === "UnityAds")?.appId});

};

main();
