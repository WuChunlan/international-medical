package com.intlmedical.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.Doctor;
import com.intlmedical.mapper.DoctorMapper;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorMapper doctorMapper;

    @GetMapping
    public Result<IPage<Doctor>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        IPage<Doctor> result = doctorMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<Doctor>()
                .eq(Doctor::getIsActive, 1)
                .orderByAsc(Doctor::getSortOrder)
        );
        return Result.ok(result);
    }
}
