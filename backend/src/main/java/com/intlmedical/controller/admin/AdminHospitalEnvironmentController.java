package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intlmedical.entity.HospitalEnvironment;
import com.intlmedical.mapper.HospitalEnvironmentMapper;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/hospital-environments")
@RequiredArgsConstructor
public class AdminHospitalEnvironmentController {

    private final HospitalEnvironmentMapper hospitalEnvironmentMapper;

    @GetMapping
    public Result<List<HospitalEnvironment>> listByHospital(
            @RequestParam Long hospitalId) {
        List<HospitalEnvironment> list = hospitalEnvironmentMapper.selectList(
            new LambdaQueryWrapper<HospitalEnvironment>()
                .eq(HospitalEnvironment::getHospitalId, hospitalId)
                .orderByAsc(HospitalEnvironment::getSortOrder)
        );
        return Result.ok(list);
    }

    @PostMapping
    public Result<Void> create(@RequestBody HospitalEnvironment env) {
        hospitalEnvironmentMapper.insert(env);
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody HospitalEnvironment env) {
        env.setId(id);
        hospitalEnvironmentMapper.updateById(env);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        hospitalEnvironmentMapper.deleteById(id);
        return Result.ok();
    }
}
