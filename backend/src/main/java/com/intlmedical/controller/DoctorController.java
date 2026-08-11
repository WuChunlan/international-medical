package com.intlmedical.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.Doctor;
import com.intlmedical.mapper.DoctorMapper;
import com.intlmedical.service.ContentTranslationService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorMapper doctorMapper;
    private final ContentTranslationService translationService;

    private static final List<String> BUILTIN_LANGS = List.of("zh", "en");

    @GetMapping
    public Result<IPage<Doctor>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "zh") String lang) {
        IPage<Doctor> result = doctorMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<Doctor>()
                .eq(Doctor::getIsActive, 1)
                .eq(Doctor::getAuditStatus, "approved")
                .orderByAsc(Doctor::getSortOrder)
        );
        if (!BUILTIN_LANGS.contains(lang)) {
            result.getRecords().forEach(d -> d.setTranslations(
                translationService.getAll("doctor", d.getId(), lang)
            ));
        }
        return Result.ok(result);
    }
}
