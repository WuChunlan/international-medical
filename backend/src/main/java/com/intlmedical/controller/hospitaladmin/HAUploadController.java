package com.intlmedical.controller.hospitaladmin;

import com.intlmedical.service.FileUploadService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/hospital-admin/upload")
@RequiredArgsConstructor
public class HAUploadController {

    private final FileUploadService fileUploadService;

    @PostMapping
    public Result<String> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", defaultValue = "misc") String category) {
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
