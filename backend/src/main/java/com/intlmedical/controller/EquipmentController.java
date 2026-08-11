package com.intlmedical.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intlmedical.entity.Equipment;
import com.intlmedical.mapper.EquipmentMapper;
import com.intlmedical.service.ContentTranslationService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipments")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentMapper equipmentMapper;
    private final ContentTranslationService translationService;

    private static final List<String> BUILTIN_LANGS = List.of("zh", "en");

    @GetMapping
    public Result<List<Equipment>> list(@RequestParam(defaultValue = "zh") String lang) {
        List<Equipment> list = equipmentMapper.selectList(
            new LambdaQueryWrapper<Equipment>()
                .eq(Equipment::getIsActive, 1)
                .eq(Equipment::getAuditStatus, "approved")
                .orderByAsc(Equipment::getSortOrder)
        );
        if (!BUILTIN_LANGS.contains(lang)) {
            list.forEach(e -> e.setTranslations(
                translationService.getAll("equipment", e.getId(), lang)
            ));
        }
        return Result.ok(list);
    }
}
