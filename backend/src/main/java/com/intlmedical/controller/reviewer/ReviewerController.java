package com.intlmedical.controller.reviewer;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.*;
import com.intlmedical.mapper.*;
import com.intlmedical.util.Result;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviewer")
@RequiredArgsConstructor
public class ReviewerController {

    private final HospitalMapper hospitalMapper;
    private final DoctorMapper doctorMapper;
    private final EquipmentMapper equipmentMapper;
    private final HospitalEnvironmentMapper hospitalEnvironmentMapper;
    private final CaseMapper caseMapper;
    private final SpecialProductMapper specialProductMapper;

    // ── pending list per resource type ──────────────────────────────────────

    @GetMapping("/pending/hospitals")
    public Result<List<Hospital>> pendingHospitals() {
        return Result.ok(hospitalMapper.selectList(
            new LambdaQueryWrapper<Hospital>().eq(Hospital::getAuditStatus, "pending")));
    }

    @GetMapping("/pending/doctors")
    public Result<List<Doctor>> pendingDoctors() {
        return Result.ok(doctorMapper.selectList(
            new LambdaQueryWrapper<Doctor>().eq(Doctor::getAuditStatus, "pending")));
    }

    @GetMapping("/pending/equipments")
    public Result<List<Equipment>> pendingEquipments() {
        return Result.ok(equipmentMapper.selectList(
            new LambdaQueryWrapper<Equipment>().eq(Equipment::getAuditStatus, "pending")));
    }

    @GetMapping("/pending/environments")
    public Result<List<HospitalEnvironment>> pendingEnvironments() {
        return Result.ok(hospitalEnvironmentMapper.selectList(
            new LambdaQueryWrapper<HospitalEnvironment>().eq(HospitalEnvironment::getAuditStatus, "pending")));
    }

    @GetMapping("/pending/cases")
    public Result<IPage<Case>> pendingCases(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(caseMapper.selectPage(new Page<>(page, size),
            new LambdaQueryWrapper<Case>().eq(Case::getAuditStatus, "pending")));
    }

    @GetMapping("/pending/products")
    public Result<List<SpecialProduct>> pendingProducts() {
        return Result.ok(specialProductMapper.selectList(
            new LambdaQueryWrapper<SpecialProduct>().eq(SpecialProduct::getAuditStatus, "pending")));
    }

    // ── approve ──────────────────────────────────────────────────────────────

    @PutMapping("/approve/{type}/{id}")
    public Result<Void> approve(@PathVariable String type, @PathVariable Long id) {
        return updateAuditStatus(type, id, "approved", null);
    }

    // ── reject ──────────────────────────────────────────────────────────────

    @PutMapping("/reject/{type}/{id}")
    public Result<Void> reject(@PathVariable String type, @PathVariable Long id,
                               @RequestBody RejectRequest req) {
        if (req.getReason() == null || req.getReason().isBlank()) {
            return Result.fail(400, "驳回原因不能为空");
        }
        return updateAuditStatus(type, id, "rejected", req.getReason());
    }

    // ── edit (reviewer direct edit, keeps current audit_status) ─────────────

    @PutMapping("/edit/hospitals/{id}")
    public Result<Void> editHospital(@PathVariable Long id, @RequestBody Hospital h) {
        h.setId(id);
        hospitalMapper.updateById(h);
        return Result.ok();
    }

    @PutMapping("/edit/doctors/{id}")
    public Result<Void> editDoctor(@PathVariable Long id, @RequestBody Doctor d) {
        d.setId(id);
        doctorMapper.updateById(d);
        return Result.ok();
    }

    @PutMapping("/edit/equipments/{id}")
    public Result<Void> editEquipment(@PathVariable Long id, @RequestBody Equipment e) {
        e.setId(id);
        equipmentMapper.updateById(e);
        return Result.ok();
    }

    @PutMapping("/edit/environments/{id}")
    public Result<Void> editEnvironment(@PathVariable Long id, @RequestBody HospitalEnvironment env) {
        env.setId(id);
        hospitalEnvironmentMapper.updateById(env);
        return Result.ok();
    }

    @PutMapping("/edit/cases/{id}")
    public Result<Void> editCase(@PathVariable Long id, @RequestBody Case c) {
        c.setId(id);
        caseMapper.updateById(c);
        return Result.ok();
    }

    @PutMapping("/edit/products/{id}")
    public Result<Void> editProduct(@PathVariable Long id, @RequestBody SpecialProduct p) {
        p.setId(id);
        specialProductMapper.updateById(p);
        return Result.ok();
    }

    // ── helper ───────────────────────────────────────────────────────────────

    private Result<Void> updateAuditStatus(String type, Long id, String status, String reason) {
        switch (type) {
            case "hospitals" -> hospitalMapper.update(null, new LambdaUpdateWrapper<Hospital>()
                .eq(Hospital::getId, id).set(Hospital::getAuditStatus, status).set(Hospital::getRejectionReason, reason));
            case "doctors" -> doctorMapper.update(null, new LambdaUpdateWrapper<Doctor>()
                .eq(Doctor::getId, id).set(Doctor::getAuditStatus, status).set(Doctor::getRejectionReason, reason));
            case "equipments" -> equipmentMapper.update(null, new LambdaUpdateWrapper<Equipment>()
                .eq(Equipment::getId, id).set(Equipment::getAuditStatus, status).set(Equipment::getRejectionReason, reason));
            case "environments" -> hospitalEnvironmentMapper.update(null, new LambdaUpdateWrapper<HospitalEnvironment>()
                .eq(HospitalEnvironment::getId, id).set(HospitalEnvironment::getAuditStatus, status).set(HospitalEnvironment::getRejectionReason, reason));
            case "cases" -> caseMapper.update(null, new LambdaUpdateWrapper<Case>()
                .eq(Case::getId, id).set(Case::getAuditStatus, status).set(Case::getRejectionReason, reason));
            case "products" -> specialProductMapper.update(null, new LambdaUpdateWrapper<SpecialProduct>()
                .eq(SpecialProduct::getId, id).set(SpecialProduct::getAuditStatus, status).set(SpecialProduct::getRejectionReason, reason));
            default -> { return Result.fail(400, "未知资源类型: " + type); }
        }
        return Result.ok();
    }

    @Data
    public static class RejectRequest {
        private String reason;
    }
}
