package com.intlmedical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intlmedical.entity.Role;
import com.intlmedical.mapper.RoleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleMapper roleMapper;

    public Integer getIdByCode(String code) {
        Role role = roleMapper.selectOne(new LambdaQueryWrapper<Role>().eq(Role::getCode, code));
        if (role == null) throw new RuntimeException("角色不存在: " + code);
        return role.getId();
    }

    public String getCodeById(Integer id) {
        if (id == null) return "user";
        Role role = roleMapper.selectById(id);
        return role != null ? role.getCode() : "user";
    }
}
