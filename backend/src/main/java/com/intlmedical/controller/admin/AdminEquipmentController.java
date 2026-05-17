package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.Equipment;
import com.intlmedical.mapper.EquipmentMapper;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/equipments")
@RequiredArgsConstructor
public class AdminEquipmentController {

    private final EquipmentMapper equipmentMapper;

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
        equipmentMapper.insert(equipment);
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Equipment equipment) {
        equipment.setId(id);
        equipmentMapper.updateById(equipment);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        equipmentMapper.update(null,
            new LambdaUpdateWrapper<Equipment>()
                .eq(Equipment::getId, id)
                .set(Equipment::getIsActive, 0)
        );
        return Result.ok();
    }
}
