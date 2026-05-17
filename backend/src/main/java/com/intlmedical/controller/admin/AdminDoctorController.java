package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.Doctor;
import com.intlmedical.mapper.DoctorMapper;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/doctors")
@RequiredArgsConstructor
public class AdminDoctorController {

    private final DoctorMapper doctorMapper;

    @GetMapping
    public Result<IPage<Doctor>> list(
            @RequestParam(required = false) Long hospitalId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        LambdaQueryWrapper<Doctor> wrapper = new LambdaQueryWrapper<Doctor>()
            .orderByAsc(Doctor::getSortOrder);
        if (hospitalId != null) {
            wrapper.eq(Doctor::getHospitalId, hospitalId);
        }
        IPage<Doctor> result = doctorMapper.selectPage(new Page<>(page, size), wrapper);
        return Result.ok(result);
    }

    @PostMapping
    public Result<Void> create(@RequestBody Doctor doctor) {
        doctorMapper.insert(doctor);
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Doctor doctor) {
        doctor.setId(id);
        doctorMapper.updateById(doctor);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        doctorMapper.update(null,
            new LambdaUpdateWrapper<Doctor>()
                .eq(Doctor::getId, id)
                .set(Doctor::getIsActive, 0)
        );
        return Result.ok();
    }
}
