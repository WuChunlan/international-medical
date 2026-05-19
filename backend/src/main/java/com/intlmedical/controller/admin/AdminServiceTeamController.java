package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.ServiceTeam;
import com.intlmedical.mapper.ServiceTeamMapper;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/service-teams")
@RequiredArgsConstructor
public class AdminServiceTeamController {

    private final ServiceTeamMapper serviceTeamMapper;

    @GetMapping
    public Result<IPage<ServiceTeam>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        IPage<ServiceTeam> result = serviceTeamMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<ServiceTeam>().orderByAsc(ServiceTeam::getSortOrder)
        );
        return Result.ok(result);
    }

    @PostMapping
    public Result<Void> create(@RequestBody ServiceTeam team) {
        serviceTeamMapper.insert(team);
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody ServiceTeam team) {
        team.setId(id);
        serviceTeamMapper.updateById(team);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        serviceTeamMapper.deleteById(id);
        return Result.ok();
    }
}
