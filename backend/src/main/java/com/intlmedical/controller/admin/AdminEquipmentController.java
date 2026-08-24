package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.Equipment;
import com.intlmedical.mapper.EquipmentMapper;
import com.intlmedical.service.ContentTranslationService;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/equipments")
@RequiredArgsConstructor
public class AdminEquipmentController {

    private final EquipmentMapper equipmentMapper;
    private final ContentTranslationService contentTranslationService;

    @GetMapping
    public Result<IPage<Equipment>> list(
            @RequestParam(required = false) Long hospitalId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        LambdaQueryWrapper<Equipment> wrapper = new LambdaQueryWrapper<Equipment>()
            .orderByAsc(Equipment::getSortOrder);
        if (hospitalId != null) {
            wrapper.eq(Equipment::getHospitalId, hospitalId);
        }
        IPage<Equipment> result = equipmentMapper.selectPage(new Page<>(page, size), wrapper);
        return Result.ok(result);
    }

    @PostMapping
    public Result<Void> create(@RequestBody Equipment equipment) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        equipment.setCreatedUser(currentUserId);
        equipment.setUpdatedUser(currentUserId);
        equipment.setAuditStatus("approved");
        equipment.setIsActive(equipment.getIsActive() != null ? equipment.getIsActive() : 1);
        equipmentMapper.insert(equipment);
        contentTranslationService.autoTranslateEntityAsync("equipment", equipment.getId(), Map.of(
            "name", nullSafe(equipment.getNameZh()),
            "desc", nullSafe(equipment.getDescZh())
        ));
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Equipment equipment) {
        Equipment existing = equipmentMapper.selectById(id);
        if (existing == null) return Result.fail(404, "设备不存在");
        if (!SecurityUtil.canEdit(existing.getCreatedUser())) {
            return Result.fail(403, "无权编辑他人创建的数据");
        }
        equipment.setId(id);
        equipment.setUpdatedUser(SecurityUtil.getCurrentUserId());
        equipment.setAuditStatus("approved");
        equipmentMapper.updateById(equipment);
        contentTranslationService.autoTranslateEntityAsync("equipment", id, Map.of(
            "name", nullSafe(equipment.getNameZh()),
            "desc", nullSafe(equipment.getDescZh())
        ));
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Equipment existing = equipmentMapper.selectById(id);
        if (existing == null) return Result.fail(404, "设备不存在");
        if (!SecurityUtil.canEdit(existing.getCreatedUser())) {
            return Result.fail(403, "无权删除他人创建的数据");
        }
        equipmentMapper.update(null,
            new LambdaUpdateWrapper<Equipment>()
                .eq(Equipment::getId, id)
                .set(Equipment::getIsActive, 0)
                .set(Equipment::getUpdatedUser, SecurityUtil.getCurrentUserId())
        );
        return Result.ok();
    }

    private static String nullSafe(String s) { return s != null ? s : ""; }
}
