package com.intlmedical.controller.admin;

import com.intlmedical.service.TranslateService;
import com.intlmedical.util.Result;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/translate")
@RequiredArgsConstructor
public class AdminTranslateController {

    private final TranslateService translateService;

    @PostMapping
    public Result<String> translate(@RequestBody TranslateRequest request) {
        try {
            String result = translateService.translate(request.getText());
            return Result.ok(result);
        } catch (Exception e) {
            return Result.fail("翻译失败：" + e.getMessage());
        }
    }

    @Data
    static class TranslateRequest {
        private String text;
    }
}
