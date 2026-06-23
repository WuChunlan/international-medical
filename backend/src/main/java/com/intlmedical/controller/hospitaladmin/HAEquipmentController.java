package com.intlmedical.controller.hospitaladmin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.Equipment;
import com.intlmedical.mapper.EquipmentMapper;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hospital-admin/equipments")
@RequiredArgsConstructor
public class HAEquipmentController {

    private final EquipmentMapper equipmentMapper;

    @GetMapping
    public Result<IPage<Equipment>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        IPage<Equipment> result = equipmentMapper.selectPage(new Page<>(page, size),
            new LambdaQueryWrapper<Equipment>()
                .eq(Equipment::getHospitalId, hospitalId)
                .orderByAsc(Equipment::getSortOrder));
        return Result.ok(result);
    }

    @PostMapping
    public Result<Void> create(@RequestBody Equipment equipment) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        equipment.setHospitalId(hospitalId);
        equipment.setAuditStatus("pending");
        equipment.setRejectionReason(null);
        equipmentMapper.insert(equipment);
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Equipment equipment) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        Equipment existing = equipmentMapper.selectById(id);
        if (existing == null || !hospitalId.equals(existing.getHospitalId())) {
            return Result.fail(403, "无权操作");
        }
        equipment.setId(id);
        equipment.setHospitalId(hospitalId);
        equipment.setAuditStatus("pending");
        equipment.setRejectionReason(null);
        equipmentMapper.updateById(equipment);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        Equipment existing = equipmentMapper.selectById(id);
        if (existing == null || !hospitalId.equals(existing.getHospitalId())) {
            return Result.fail(403, "无权操作");
        }
        equipmentMapper.deleteById(id);
        return Result.ok();
    }
}
