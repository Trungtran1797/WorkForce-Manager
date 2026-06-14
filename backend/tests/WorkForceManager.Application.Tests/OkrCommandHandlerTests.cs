using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using WorkForceManager.Application.Common.Exceptions;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Application.Features.Okrs.Commands.DeleteObjective;
using WorkForceManager.Application.Features.Okrs.Commands.SaveObjective;
using WorkForceManager.Application.Features.Okrs.Commands.UpdateKeyResultProgress;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;
using WorkForceManager.Infrastructure.Persistence;
using WorkForceManager.Infrastructure.Persistence.Interceptors;
using Xunit;

namespace WorkForceManager.Application.Tests;

public class OkrCommandHandlerTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IDateTimeService> _dateTime = new();

    public OkrCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options, new AuditableEntitySaveChangesInterceptor(_currentUser.Object, _dateTime.Object));
        _dateTime.Setup(x => x.UtcNow).Returns(new DateTime(2026, 6, 14, 9, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public async Task Save_ShouldCreateObjectiveWithKeyResults_AndComputeProgress()
    {
        _context.Employees.Add(new Employee { Id = 1, EmployeeCode = "E1", FullName = "Emp" });
        await _context.SaveChangesAsync();

        var handler = new SaveObjectiveCommandHandler(_context);
        var command = new SaveObjectiveCommand(
            0,
            "Tăng doanh số Q2",
            "Mô tả",
            nameof(OkrOwnerType.Individual),
            null,
            1,
            "2026-Q2",
            nameof(OkrStatus.Active),
            new[]
            {
                new KeyResultInput(0, "Doanh số mới", 100m, 50m, "khách hàng", 1m),
                new KeyResultInput(0, "Tỷ lệ giữ chân", 100m, 100m, "%", 1m)
            });

        var result = await handler.Handle(command, CancellationToken.None);

        result.Id.Should().BeGreaterThan(0);
        result.KeyResults.Should().HaveCount(2);
        result.Progress.Should().Be(75m);
    }

    [Fact]
    public async Task UpdateKeyResultProgress_ShouldMarkAchieved_WhenAllKeyResultsComplete()
    {
        var objective = new OkrObjective
        {
            Title = "Mục tiêu",
            OwnerType = OkrOwnerType.Individual,
            EmployeeId = 1,
            Period = "2026-Q2",
            Status = OkrStatus.Active,
            KeyResults = new List<KeyResult>
            {
                new() { Title = "KR1", TargetValue = 10m, CurrentValue = 10m, Weight = 1m }
            }
        };
        _context.Employees.Add(new Employee { Id = 1, EmployeeCode = "E1", FullName = "Emp" });
        _context.OkrObjectives.Add(objective);
        await _context.SaveChangesAsync();

        var krId = objective.KeyResults.First().Id;

        var handler = new UpdateKeyResultProgressCommandHandler(_context);
        var result = await handler.Handle(new UpdateKeyResultProgressCommand(krId, 10m), CancellationToken.None);

        result.Status.Should().Be(OkrStatus.Achieved.ToString());
        result.Progress.Should().Be(100m);
    }

    [Fact]
    public async Task Delete_ShouldRemoveObjective_AndThrowNotFoundIfMissing()
    {
        var objective = new OkrObjective
        {
            Title = "Mục tiêu",
            OwnerType = OkrOwnerType.Individual,
            EmployeeId = 1,
            Period = "2026-Q2",
            Status = OkrStatus.Draft
        };
        _context.Employees.Add(new Employee { Id = 1, EmployeeCode = "E1", FullName = "Emp" });
        _context.OkrObjectives.Add(objective);
        await _context.SaveChangesAsync();

        var handler = new DeleteObjectiveCommandHandler(_context);
        await handler.Handle(new DeleteObjectiveCommand(objective.Id), CancellationToken.None);

        (await _context.OkrObjectives.AnyAsync(o => o.Id == objective.Id)).Should().BeFalse();

        Func<Task> act = () => handler.Handle(new DeleteObjectiveCommand(objective.Id), CancellationToken.None);
        await act.Should().ThrowAsync<NotFoundException>();
    }
}
