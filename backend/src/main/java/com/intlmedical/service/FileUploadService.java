package com.intlmedical.service;

import com.intlmedical.entity.SiteConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileUploadService {

    private final SiteConfigService siteConfigService;

    public String upload(MultipartFile file, String category) throws IOException {
        String basePath = getConfigValue("upload_base_path");
        String baseUrl = getConfigValue("upload_base_url");
        long maxSizeMb = Long.parseLong(getConfigValue("upload_max_size_mb"));
        List<String> allowedImages = Arrays.asList(getConfigValue("upload_allowed_image_types").split(","));
        List<String> allowedVideos = Arrays.asList(getConfigValue("upload_allowed_video_types").split(","));

        if (file.isEmpty()) throw new IllegalArgumentException("文件不能为空");
        if (file.getSize() > maxSizeMb * 1024 * 1024)
            throw new IllegalArgumentException("文件大小超过限制 " + maxSizeMb + "MB");

        String originalName = file.getOriginalFilename();
        String ext = originalName != null && originalName.contains(".")
            ? originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase()
            : "";

        boolean isImage = allowedImages.contains(ext);
        boolean isVideo = allowedVideos.contains(ext);
        if (!isImage && !isVideo)
            throw new IllegalArgumentException("不支持的文件格式: " + ext);

        String filename = UUID.randomUUID() + "." + ext;
        Path dir = Paths.get(basePath, category);
        Files.createDirectories(dir);
        Files.copy(file.getInputStream(), dir.resolve(filename));

        return baseUrl + "/" + category + "/" + filename;
    }

    private String getConfigValue(String key) {
        SiteConfig config = siteConfigService.getByKey(key);
        if (config == null) throw new IllegalStateException("缺少配置项: " + key);
        return config.getValueZh();
    }
}
