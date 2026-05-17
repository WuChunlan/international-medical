package com.intlmedical.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intlmedical.entity.Equipment;
import com.intlmedical.mapper.EquipmentMapper;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipments")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentMapper equipmentMapper;

    @GetMapping
    public Result<List<Equipment>> list() {
        List<Equipment> list = equipmentMapper.selectList(
            new LambdaQueryWrapper<Equipment>()
                .eq(Equipment::getIsActive, 1)
                .orderByAsc(Equipment::getSortOrder)
        );
        return Result.ok(list);
    }
}
