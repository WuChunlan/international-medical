package com.intlmedical.controller.admin;

import com.intlmedical.service.FileUploadService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/admin/upload")
@RequiredArgsConstructor
public class AdminUploadController {

    private final FileUploadService fileUploadService;

    /**
     * category: hospitals/covers, hospitals/videos, hospitals/banners,
     *           doctors/photos, equipments/images, products/covers, cases/covers
     */
    @PostMapping
    public Result<String> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", defaultValue = "misc") String category) {
        // Sanitize category to prevent path traversal
        String safeCategory = category.replaceAll("[^a-zA-Z0-9/_-]", "");
        try {
            String url = fileUploadService.upload(file, safeCategory);
            return Result.ok(url);
        } catch (IllegalArgumentException e) {
            return Result.fail(400, e.getMessage());
        } catch (IOException e) {
            return Result.fail("文件上传失败: " + e.getMessage());
        }
    }
}
