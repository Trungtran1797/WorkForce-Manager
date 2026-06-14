using FluentAssertions;
using WorkForceManager.Domain.Entities;
using WorkForceManager.Domain.Enums;
using Xunit;

namespace WorkForceManager.Domain.Tests;

public class EmployeeTests
{
    [Fact]
    public void Employee_ShouldInitializeWithDefaultValues()
    {
        // Arrange & Act
        var employee = new Employee();

        // Assert
        employee.Status.Should().Be(EmployeeStatus.Active);
        employee.EmployeeCode.Should().BeEmpty();
        employee.FullName.Should().BeEmpty();
        employee.IsDeleted.Should().BeFalse();
    }

    [Fact]
    public void Employee_ShouldSetPropertiesCorrectly()
    {
        // Arrange
        var employee = new Employee
        {
            EmployeeCode = "EMP001",
            FullName = "Nguyen Van A",
            Gender = Gender.Male,
            Status = EmployeeStatus.Active,
            DateOfBirth = new DateTime(1990, 1, 1),
            HireDate = new DateTime(2023, 5, 1)
        };

        // Act & Assert
        employee.EmployeeCode.Should().Be("EMP001");
        employee.FullName.Should().Be("Nguyen Van A");
        employee.Gender.Should().Be(Gender.Male);
        employee.DateOfBirth.Year.Should().Be(1990);
        employee.HireDate.Month.Should().Be(5);
    }
}
